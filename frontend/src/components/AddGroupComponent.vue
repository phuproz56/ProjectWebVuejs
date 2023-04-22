<template>
	<div class="container">
		<!-- heading -->
		<div class="row">
            <div class="col-md-12">
                <h1 class="text-center text-white">Add Group</h1>
            </div>
        </div>

		<div class="row">
			<div class="offset-md-3 col-md-6">
				<!-- form to create new group -->
				<form method="POST" v-on:submit.prevent="addGroup">
					<!-- input field for name of group -->
					<div class="form-group">
						<label class="text-white">Name</label>
						<input type="text" name="name" class="form-control" required />
					</div>
					<!-- <div class="form-group" style="margin-top: 20px; margin-bottom: 30px;">
						<label class="text-white">Picture</label>
						<input type="file" name="picture" accept="image/*" class="form-control" />
					</div> -->
					<div class="d-grid gap-2 " style="margin-top: 20px; margin-bottom: 30px;">
						<input type="submit" class="btn btn-primary btn-block" v-bind:value="isLoading ? 'Creating...' : 'Create group'" v-bind:disabled="isLoading" />
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script>
	import axios from "axios"
	import swal from "sweetalert2"
	export default {
		data() {
			return {
				"isLoading": false
			}
		},
		methods: {
			addGroup: async function () {
				const form = event.target
				const formData = new FormData(form)
				this.isLoading = true
				const response = await axios.post(
					this.$apiURL + "/groups/add",
					formData,
					{
						headers: this.$headers
					}
				)
				this.isLoading = false
				swal.fire("Add group", response.data.message, response.data.status)
				if (response.data.status == "success") {
					form.reset()
				}
			}
		},
	}
</script>